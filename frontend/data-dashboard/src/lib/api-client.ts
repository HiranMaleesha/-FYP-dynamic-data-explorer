const apiClient = {
    async uploadFile(file: File) {
        console.log('uploadFile called with file:', file.name);
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('http://localhost:8000/api/upload', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
        }

        return response.json();
    }
};

export default apiClient;