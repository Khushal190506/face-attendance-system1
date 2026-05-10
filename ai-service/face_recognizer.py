"""
face_recognizer.py
------------------
Loads the trained LBPH model and recognizes a face in a given image.
Returns the student numeric ID and confidence score.
"""

import cv2
import json
import os
import numpy as np
from PIL import Image

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
MODEL_PATH = os.path.join(MODEL_DIR, "trained_model.yml")
LABELS_PATH = os.path.join(MODEL_DIR, "labels.json")

# OpenCV LBPH: lower distance = more confident. 
# Threshold: if distance > this value, mark as "unknown"
CONFIDENCE_THRESHOLD = 85  # distances above this are "unknown"

# Load face cascade classifier (Haar cascade)
FACE_CASCADE = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)


def load_model():
    """Load trained LBPH model from disk."""
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            f"Trained model not found at {MODEL_PATH}. "
            "Please run training first via POST /train"
        )
    recognizer = cv2.face.LBPHFaceRecognizer_create()
    recognizer.read(MODEL_PATH)

    with open(LABELS_PATH, "r") as f:
        label_map = json.load(f)

    return recognizer, label_map


def lbph_distance_to_confidence(distance: float) -> float:
    """
    Convert LBPH distance to a 0-100 confidence percentage.
    Distance 0 = 100% confidence, Distance 85+ = 0% confidence.
    """
    confidence = max(0, min(100, (1 - distance / CONFIDENCE_THRESHOLD) * 100))
    return round(confidence, 2)


def recognize_face(image_path: str) -> dict:
    """
    Recognize face(s) in the given image file.
    Returns dict with: recognized, studentId, confidence, faceBox
    """
    result = {
        "recognized": False,
        "studentId": -1,
        "confidence": 0.0,
        "faceBox": None,
        "message": "",
    }

    # Load and preprocess image
    try:
        img = cv2.imread(image_path)
        if img is None:
            # Try Pillow fallback
            pil_img = Image.open(image_path).convert("RGB")
            img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
    except Exception as e:
        result["message"] = f"Could not load image: {e}"
        return result

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.equalizeHist(gray)  # improve contrast

    # Detect faces
    faces = FACE_CASCADE.detectMultiScale(
        gray, scaleFactor=1.1, minNeighbors=5, minSize=(60, 60)
    )

    if len(faces) == 0:
        result["message"] = "No face detected in image"
        return result

    # Load model once (lazy load for performance)
    try:
        recognizer, label_map = load_model()
    except FileNotFoundError as e:
        result["message"] = str(e)
        return result

    # Process the largest face (most prominent)
    largest = max(faces, key=lambda f: f[2] * f[3])
    x, y, w, h = largest
    face_roi = gray[y:y + h, x:x + w]
    face_roi = cv2.resize(face_roi, (200, 200))

    student_id_raw, distance = recognizer.predict(face_roi)
    confidence = lbph_distance_to_confidence(distance)

    result["faceBox"] = {"x": int(x), "y": int(y), "w": int(w), "h": int(h)}

    if distance <= CONFIDENCE_THRESHOLD and confidence >= 40:
        result["recognized"] = True
        result["studentId"] = int(student_id_raw)
        result["confidence"] = confidence
        result["message"] = f"Recognized student {student_id_raw} with {confidence:.1f}% confidence"
    else:
        result["recognized"] = False
        result["studentId"] = -1
        result["confidence"] = confidence
        result["message"] = f"Unknown face (confidence too low: {confidence:.1f}%)"

    return result


def recognize_face_from_bytes(image_bytes: bytes) -> dict:
    """Recognize face from raw image bytes (for direct upload)."""
    import tempfile
    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
        tmp.write(image_bytes)
        tmp_path = tmp.name

    result = recognize_face(tmp_path)
    os.unlink(tmp_path)
    return result


if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python face_recognizer.py <image_path>")
    else:
        res = recognize_face(sys.argv[1])
        print(json.dumps(res, indent=2))
