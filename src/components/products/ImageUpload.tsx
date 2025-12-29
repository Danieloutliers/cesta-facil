import { useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
    onImageUploaded: (url: string) => void;
    currentImage?: string;
}

export function ImageUpload({ on ImageUploaded, currentImage }: ImageUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(currentImage || null);
    const { toast } = useToast();

    const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast({ title: 'Erro', description: 'Por favor, selecione uma imagem', variant: 'destructive' });
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast({ title: 'Erro', description: 'Imagem muito grande (máx 2MB)', variant: 'destructive' });
            return;
        }

        setUploading(true);

        try {
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);

            // Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `products/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data } = supabase.storage
                .from('product-images')
                .getPublicUrl(filePath);

            onImageUploaded(data.publicUrl);
            toast({ title: 'Sucesso!', description: 'Imagem enviada com sucesso' });
        } catch (error) {
            console.error('Error uploading image:', error);
            toast({ title: 'Erro', description: 'Falha ao enviar imagem', variant: 'destructive' });
        } finally {
            setUploading(false);
        }
    }, [onImageUploaded, toast]);

    const removeImage = () => {
        setPreview(null);
        onImageUploaded('');
    };

    return (
        <div className="space-y-2">
            {preview ? (
                <div className="relative w-full h-48 border rounded-lg overflow-hidden bg-muted">
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={removeImage}
                        type="button"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {uploading ? (
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                        ) : (
                            <>
                                <ImageIcon className="w-10 h-10 mb-3 text-muted-foreground" />
                                <p className="mb-2 text-sm text-muted-foreground">
                                    <span className="font-semibold">Clique para enviar</span> ou arraste uma imagem
                                </p>
                                <p className="text-xs text-muted-foreground">PNG, JPG, WEBP (máx 2MB)</p>
                            </>
                        )}
                    </div>
                    <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={uploading}
                    />
                </label>
            )}
        </div>
    );
}
