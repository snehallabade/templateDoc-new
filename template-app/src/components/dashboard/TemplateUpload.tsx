import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

const TemplateUpload: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setError(null);

        const { data, error } = await supabase.storage
            .from('templates')
            .upload(`public/${file.name}`, file);

        if (error) {
            setError(error.message);
        } else {
            alert('File uploaded successfully!');
        }

        setUploading(false);
    };

    return (
        <div>
            <h2>Upload Template</h2>
            <input type="file" onChange={handleFileChange} />
            <button onClick={handleUpload} disabled={uploading}>
                {uploading ? 'Uploading...' : 'Upload'}
            </button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
};

export default TemplateUpload;