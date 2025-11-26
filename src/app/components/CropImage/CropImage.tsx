"use client";

import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "../../../lib/cropUtils";
import styles from "./CropImage.module.css";

type AvatarCropperProps = {
  imageFile: File;
  onUpload: (file: File) => void;
  onCancel?: () => void;
};

export default function AvatarCropper({ imageFile, onUpload, onCancel }: AvatarCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const handleCropComplete = useCallback((_: any, areaPixels: any) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    const croppedBlob = await getCroppedImg(imageFile, croppedAreaPixels);
    const croppedFile = new File([croppedBlob], imageFile.name, { type: "image/png" });
    onUpload(croppedFile);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>Adjust your profile picture</h2>

        <div className={styles.cropperContainer}>
          {/* Camera icon overlay */}
          <div className={styles.cameraIcon}>📷</div>

          <Cropper
            image={URL.createObjectURL(imageFile)}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
            cropShape="round"
            showGrid={false}
          />
        </div>

        <div className={styles.sliderWrapper}>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className={styles.zoomSlider}
          />
        </div>

        <div className={styles.buttons}>
          <button className={styles.confirmBtn} onClick={handleConfirm}>
            Save
          </button>

          {onCancel && (
            <button className={styles.cancelBtn} onClick={onCancel}>
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
