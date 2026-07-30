package com.attendance.system.service;

import org.springframework.stereotype.Service;
import javax.imageio.ImageIO;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.util.Base64;

@Service
public class FaceVerificationService {

    // Internal relaxed correlation threshold for simple college project face matching
    // (Accepts variations in background, lighting, clothing, webcam quality & slight angle changes)
    private static final double INTERNAL_CORRELATION_THRESHOLD = 0.25;

    /**
     * Compares two Base64 image strings without external C++ native dependencies.
     * Uses central face crop & normalized grayscale cross-correlation for structural face comparison.
     */
    public VerificationResult verifyFace(String profileBase64, String captureBase64) {
        try {
            if (profileBase64 == null || profileBase64.trim().isEmpty() ||
                captureBase64 == null || captureBase64.trim().isEmpty()) {
                return new VerificationResult(false, "Verification Failed");
            }

            BufferedImage img1 = decodeBase64ToImage(profileBase64);
            BufferedImage img2 = decodeBase64ToImage(captureBase64);

            if (img1 == null || img2 == null) {
                return new VerificationResult(false, "Verification Failed");
            }

            // Crop central 70% region to focus on face features and ignore background variations
            BufferedImage faceCrop1 = cropCentralFaceRegion(img1);
            BufferedImage faceCrop2 = cropCentralFaceRegion(img2);

            // Resize images to a normalized 32x32 grid for structural face matching
            int width = 32;
            int height = 32;
            BufferedImage resized1 = resizeImage(faceCrop1, width, height);
            BufferedImage resized2 = resizeImage(faceCrop2, width, height);

            double[] gray1 = extractNormalizedGrayscale(resized1, width, height);
            double[] gray2 = extractNormalizedGrayscale(resized2, width, height);

            double correlation = calculateNormalizedCrossCorrelation(gray1, gray2);

            boolean isSuccess = correlation >= INTERNAL_CORRELATION_THRESHOLD;
            String message = isSuccess ? "Verification Successful" : "Verification Failed";

            return new VerificationResult(isSuccess, message);

        } catch (Exception e) {
            return new VerificationResult(false, "Verification Failed");
        }
    }

    private BufferedImage cropCentralFaceRegion(BufferedImage src) {
        int w = src.getWidth();
        int h = src.getHeight();
        int cropW = (int) (w * 0.75);
        int cropH = (int) (h * 0.75);
        int x = (w - cropW) / 2;
        int y = (h - cropH) / 2;
        return src.getSubimage(x, y, cropW, cropH);
    }

    private double[] extractNormalizedGrayscale(BufferedImage img, int width, int height) {
        int size = width * height;
        double[] grays = new double[size];
        double sum = 0;

        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int rgb = img.getRGB(x, y);
                int r = (rgb >> 16) & 0xff;
                int g = (rgb >> 8) & 0xff;
                int b = rgb & 0xff;
                double gray = 0.299 * r + 0.587 * g + 0.114 * b;
                grays[y * width + x] = gray;
                sum += gray;
            }
        }

        double mean = sum / size;
        double varianceSum = 0;
        for (int i = 0; i < size; i++) {
            grays[i] -= mean;
            varianceSum += grays[i] * grays[i];
        }

        double stdDev = Math.sqrt(varianceSum / size);
        if (stdDev > 1e-5) {
            for (int i = 0; i < size; i++) {
                grays[i] /= stdDev;
            }
        }

        return grays;
    }

    private double calculateNormalizedCrossCorrelation(double[] arr1, double[] arr2) {
        double dotProduct = 0;
        for (int i = 0; i < arr1.length; i++) {
            dotProduct += arr1[i] * arr2[i];
        }
        return dotProduct / arr1.length;
    }

    private BufferedImage decodeBase64ToImage(String base64Str) throws Exception {
        String cleanBase64 = base64Str;
        if (base64Str.contains(",")) {
            cleanBase64 = base64Str.split(",")[1];
        }
        byte[] imageBytes = Base64.getDecoder().decode(cleanBase64.trim());
        return ImageIO.read(new ByteArrayInputStream(imageBytes));
    }

    private BufferedImage resizeImage(BufferedImage originalImage, int targetWidth, int targetHeight) {
        BufferedImage resizedImage = new BufferedImage(targetWidth, targetHeight, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics2D = resizedImage.createGraphics();
        graphics2D.drawImage(originalImage, 0, 0, targetWidth, targetHeight, null);
        graphics2D.dispose();
        return resizedImage;
    }

    public static class VerificationResult {
        private final boolean success;
        private final String message;

        public VerificationResult(boolean success, String message) {
            this.success = success;
            this.message = message;
        }

        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
    }
}
