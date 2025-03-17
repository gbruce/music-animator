// Image API
export const imageApi = {
  // Upload an image
  async uploadImage(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch(`${API_BASE_URL}/api/images/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Failed to upload image');
    }
    
    return response.json();
  },
  
  // Get all images for the current user
  async getUserImages(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/api/images`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch images');
    }
    
    return response.json();
  },
  
  // Get image by identifier
  async getImageByIdentifier(identifier: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/images/${identifier}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch image');
    }
    
    return response.json();
  },
  
  // Delete an image
  async deleteImage(identifier: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/images/${identifier}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete image');
    }
  },
  
  // Get image URL by identifier
  getImageUrl(identifier: string): string {
    return `${API_BASE_URL}/images/${identifier}`;
  }
};

// Export the image API
export { imageApi }; 