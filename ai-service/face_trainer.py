"""
face_trainer.py
---------------
Trains an OpenCV LBPH face recognizer using Cloudinary URLs.
Saves the trained model to models/trained_model.yml and uploads to Cloudinary.
"""

import cv2
import os
import json
import numpy as np
from PIL import Image
import requests
import io
import cloudinary.uploader

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
MODEL_PATH = os.path.join(MODEL_DIR, "trained_model.yml")
LABELS_PATH = os.path.join(MODEL_DIR, "labels.json")


def get_images_and_labels(students_payload):
    """
    Reads student face images from Cloudinary URLs.
    students_payload format: [{"studentId": 1, "images": ["url1", "url2"]}, ...]
    Returns (faces_list, labels_list)
    """
    face_cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    )

    faces = []
    labels = []
    label_map = {}

    if not students_payload:
        raise ValueError("No students payload provided.")

    for student in students_payload:
        student_id = student.get("studentId")
        image_urls = student.get("images", [])
        
        if not student_id or not image_urls:
            continue

        label_map[student_id] = student_id
        print(f"Processing student_{student_id}: {len(image_urls)} images from Cloudinary")

        for img_url in image_urls:
            try:
                response = requests.get(img_url, timeout=10)
                response.raise_for_status()
                pil_img = Image.open(io.BytesIO(response.content)).convert("L")  # grayscale
                img_array = np.array(pil_img, dtype=np.uint8)

                # Detect faces in the image
                detected = face_cascade.detectMultiScale(
                    img_array, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30)
                )

                for (x, y, w, h) in detected:
                    face_roi = img_array[y:y + h, x:x + w]
                    face_roi = cv2.resize(face_roi, (200, 200))
                    faces.append(face_roi)
                    labels.append(student_id)

                # If no face detected, try using the whole image
                if len(detected) == 0:
                    resized = cv2.resize(img_array, (200, 200))
                    faces.append(resized)
                    labels.append(student_id)

            except Exception as e:
                print(f"Warning: Error processing {img_url}: {e}")
                continue

    return faces, labels, label_map


def train_model(students_payload):
    """Train LBPH model and save to disk & Cloudinary."""
    os.makedirs(MODEL_DIR, exist_ok=True)

    print("Loading face dataset from Cloudinary...")
    faces, labels, label_map = get_images_and_labels(students_payload)

    if not faces:
        raise ValueError("No faces found in dataset. Capture more face samples.")

    print(f"Found {len(faces)} face samples for {len(set(labels))} students")
    print("Training LBPH model...")

    recognizer = cv2.face.LBPHFaceRecognizer_create(
        radius=1, neighbors=8, grid_x=8, grid_y=8, threshold=100.0
    )
    recognizer.train(faces, np.array(labels))
    recognizer.save(MODEL_PATH)

    # Save label map as JSON
    with open(LABELS_PATH, "w") as f:
        json.dump({str(k): v for k, v in label_map.items()}, f, indent=2)

    print(f"Model saved locally to {MODEL_PATH}")
    
    # Upload to Cloudinary for stateless backup
    try:
        print("Uploading trained model and labels to Cloudinary backup...")
        res_model = cloudinary.uploader.upload(
            MODEL_PATH, 
            resource_type="raw", 
            public_id="face_attendance/models/trained_model.yml",
            overwrite=True
        )
        res_labels = cloudinary.uploader.upload(
            LABELS_PATH, 
            resource_type="raw", 
            public_id="face_attendance/models/labels.json",
            overwrite=True
        )
        print(f"Model backed up to Cloudinary: {res_model.get('secure_url')}")
        print(f"Labels backed up to Cloudinary: {res_labels.get('secure_url')}")
    except Exception as e:
        print(f"Warning: Failed to upload to Cloudinary: {e}")

    return len(faces), len(set(labels))
