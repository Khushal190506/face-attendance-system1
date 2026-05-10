"""
app.py — AI Face Recognition Service
-------------------------------------
Flask REST API exposing:
  GET  /health           - health check
  POST /train            - retrain LBPH model on all student datasets
  POST /recognize        - recognize face in uploaded image
  POST /capture/<id>     - save face sample for a student
"""

import os
import cv2
import json
import traceback
import numpy as np
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import io
import requests
import cloudinary

from face_trainer import train_model
from face_recognizer import recognize_face, recognize_face_from_bytes

app = Flask(__name__)
CORS(app)

cloudinary.config(
  cloud_name = os.environ.get('CLOUDINARY_CLOUD_NAME'),
  api_key = os.environ.get('CLOUDINARY_API_KEY'),
  api_secret = os.environ.get('CLOUDINARY_API_SECRET')
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "dataset")
MODEL_DIR = os.path.join(BASE_DIR, "models")
os.makedirs(DATASET_DIR, exist_ok=True)
os.makedirs(MODEL_DIR, exist_ok=True)

FACE_CASCADE = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)

def download_model_if_missing():
    model_path = os.path.join(MODEL_DIR, "trained_model.yml")
    labels_path = os.path.join(MODEL_DIR, "labels.json")
    
    if not os.path.exists(model_path) or not os.path.exists(labels_path):
        print("Model or labels not found locally. Attempting to download from Cloudinary...")
        try:
            cloud_name = os.environ.get('CLOUDINARY_CLOUD_NAME')
            if not cloud_name:
                print("CLOUDINARY_CLOUD_NAME not set. Cannot download model.")
                return
                
            model_url = f"https://res.cloudinary.com/{cloud_name}/raw/upload/face_attendance/models/trained_model.yml"
            labels_url = f"https://res.cloudinary.com/{cloud_name}/raw/upload/face_attendance/models/labels.json"
            
            res_model = requests.get(model_url, timeout=15)
            res_labels = requests.get(labels_url, timeout=15)
            
            if res_model.status_code == 200 and res_labels.status_code == 200:
                with open(model_path, "wb") as f:
                    f.write(res_model.content)
                with open(labels_path, "wb") as f:
                    f.write(res_labels.content)
                print("Model and labels successfully downloaded from Cloudinary.")
            else:
                print("Model or labels not found on Cloudinary (or not trained yet).")
        except Exception as e:
            print(f"Error downloading model: {e}")

download_model_if_missing()


# ──────────────────────────────────────────────
#  GET /health
# ──────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    model_exists = os.path.exists(os.path.join(MODEL_DIR, "trained_model.yml"))
    dataset_count = 0
    student_count = 0

    if os.path.exists(DATASET_DIR):
        student_dirs = [
            d for d in os.listdir(DATASET_DIR)
            if os.path.isdir(os.path.join(DATASET_DIR, d))
        ]
        student_count = len(student_dirs)
        dataset_count = sum(
            len([f for f in os.listdir(os.path.join(DATASET_DIR, d))
                 if f.lower().endswith((".jpg", ".jpeg", ".png"))])
            for d in student_dirs
        )

    return jsonify({
        "status": "online",
        "service": "Face Attendance AI Service",
        "model_trained": model_exists,
        "total_students": student_count,
        "total_face_samples": dataset_count,
        "timestamp": datetime.now().isoformat(),
    })


# ──────────────────────────────────────────────
#  POST /train
# ──────────────────────────────────────────────
@app.route("/train", methods=["POST"])
def train():
    try:
        payload = request.get_json() or {}
        students = payload.get("students", [])
        if not students:
            return jsonify({"success": False, "message": "No students data provided"}), 400
            
        total_faces, total_students = train_model(students)
        return jsonify({
            "success": True,
            "message": f"Model trained successfully",
            "total_faces": total_faces,
            "total_students": total_students,
            "model_path": os.path.join(MODEL_DIR, "trained_model.yml"),
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "message": str(e)}), 500


# ──────────────────────────────────────────────
#  POST /recognize
# ──────────────────────────────────────────────
@app.route("/recognize", methods=["POST"])
def recognize():
    """
    Accept an image (multipart/form-data with field 'image')
    Returns recognition result with studentId and confidence.
    """
    try:
        if "image" not in request.files:
            return jsonify({"success": False, "message": "No image provided"}), 400

        file = request.files["image"]
        image_bytes = file.read()

        result = recognize_face_from_bytes(image_bytes)

        return jsonify({
            "success": True,
            "recognized": result["recognized"],
            "studentId": result["studentId"],
            "confidence": result["confidence"],
            "faceBox": result["faceBox"],
            "message": result["message"],
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "message": str(e)}), 500


# ──────────────────────────────────────────────
#  POST /capture/<student_numeric_id>
# ──────────────────────────────────────────────
@app.route("/capture/<int:student_id>", methods=["POST"])
def capture_face(student_id):
    """
    Save face sample image to the student's dataset folder.
    Accepts multipart/form-data with 'face' image field.
    Returns current count of samples saved.
    """
    try:
        if "face" not in request.files:
            return jsonify({"success": False, "message": "No face image provided"}), 400

        file = request.files["face"]
        student_dir = os.path.join(DATASET_DIR, f"student_{student_id}")
        os.makedirs(student_dir, exist_ok=True)

        # Count existing images
        existing = [
            f for f in os.listdir(student_dir)
            if f.lower().endswith((".jpg", ".jpeg", ".png"))
        ]
        count = len(existing) + 1

        # Save image
        img_path = os.path.join(student_dir, f"face_{count:04d}.jpg")
        pil_img = Image.open(io.BytesIO(file.read())).convert("RGB")

        # Optionally detect and crop face before saving
        img_array = np.array(pil_img)
        gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        faces = FACE_CASCADE.detectMultiScale(gray, 1.1, 5, minSize=(60, 60))

        if len(faces) > 0:
            x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
            face_crop = pil_img.crop((x, y, x + w, y + h)).resize((200, 200))
            face_crop.save(img_path, "JPEG", quality=90)
        else:
            pil_img.resize((200, 200)).save(img_path, "JPEG", quality=90)

        return jsonify({
            "success": True,
            "message": f"Face sample {count} saved",
            "count": count,
            "isReady": count >= 5,
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "message": str(e)}), 500


# ──────────────────────────────────────────────
#  POST /detect  (live face detection metadata)
# ──────────────────────────────────────────────
@app.route("/detect", methods=["POST"])
def detect_faces():
    """
    Return bounding boxes of detected faces in an image.
    Does NOT perform recognition. Used for live preview overlay.
    """
    try:
        if "image" not in request.files:
            return jsonify({"success": False, "message": "No image provided"}), 400

        file = request.files["image"]
        pil_img = Image.open(io.BytesIO(file.read())).convert("L")
        gray = np.array(pil_img, dtype=np.uint8)

        faces = FACE_CASCADE.detectMultiScale(gray, 1.1, 5, minSize=(40, 40))
        face_list = [{"x": int(x), "y": int(y), "w": int(w), "h": int(h)} for (x, y, w, h) in faces]

        return jsonify({"success": True, "faces": face_list, "count": len(face_list)})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


if __name__ == "__main__":
    print("AI Face Recognition Service starting on port 8000...")
    print(f"Dataset directory: {DATASET_DIR}")
    print(f"Model directory:   {MODEL_DIR}")
    app.run(host="0.0.0.0", port=8000, debug=False)
