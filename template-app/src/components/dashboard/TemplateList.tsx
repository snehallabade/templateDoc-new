import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const TemplateList: React.FC = () => {
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTemplates = async () => {
            const user = supabase.auth.user();
            if (user) {
                const { data, error } = await supabase
                    .from('templates')
                    .select('*')
                    .eq('user_id', user.id);

                if (error) {
                    console.error('Error fetching templates:', error);
                } else {
                    setTemplates(data);
                }
            }
            setLoading(false);
        };

        fetchTemplates();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h2>Your Uploaded Templates</h2>
            <ul>
                {templates.length > 0 ? (
                    templates.map((template) => (
                        <li key={template.id}>{template.name}</li>
                    ))
                ) : (
                    <li>No templates uploaded yet.</li>
                )}
            </ul>
        </div>
    );
};

export default TemplateList;