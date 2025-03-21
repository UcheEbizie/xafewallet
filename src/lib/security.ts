/**
 * Generates a secure random token for sharing links
 * @param length Length of the token in bytes (default: 16)
 * @returns Hexadecimal string representation of the token
 */
export const generateSecureToken = (length = 16): string => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Hashes a password for secure storage
 * @param password Plain text password
 * @returns Promise resolving to a hash string
 */
export const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Verifies a password against a stored hash
 * @param password Plain text password to verify
 * @param hash Stored hash to compare against
 * @returns Promise resolving to boolean indicating if password matches
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
};

/**
 * Adds a watermark to an image
 * @param imageFile Original image file
 * @param watermarkText Text to use as watermark
 * @returns Promise resolving to a new File object with watermark
 */
export const addWatermarkToImage = async (
  imageFile: File,
  watermarkText: string = "Shared via XafeWallet"
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    
    reader.onload = (e) => {
      img.src = e.target.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas dimensions to match image
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw the original image
        ctx.drawImage(img, 0, 0);
        
        // Add watermark
        ctx.save();
        ctx.globalAlpha = 0.3; // Watermark opacity
        ctx.font = `${Math.floor(img.width / 20)}px Arial`;
        ctx.fillStyle = '#666666';
        
        // Rotate and position watermark
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(-Math.PI / 4);
        
        // Draw watermark text
        const textMetrics = ctx.measureText(watermarkText);
        ctx.fillText(watermarkText, -textMetrics.width / 2, 0);
        
        ctx.restore();
        
        // Convert canvas to blob
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to create watermarked image'));
            return;
          }
          
          const watermarkedFile = new File(
            [blob], 
            imageFile.name, 
            { type: imageFile.type }
          );
          
          resolve(watermarkedFile);
        }, imageFile.type);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image for watermarking'));
      };
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read image file'));
    };
    
    reader.readAsDataURL(imageFile);
  });
};