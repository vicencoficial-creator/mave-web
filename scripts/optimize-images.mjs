import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imagesDir = path.join(__dirname, '..', 'public', 'images');
const backupDir = path.join(__dirname, '..', 'public', 'images_backup');

// Create backup dir if not exists
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

async function optimizeImages(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            await optimizeImages(filePath);
        } else if (file.match(/\.(jpg|jpeg|png)$/i)) {
            console.log(`Optimizing ${file}...`);
            const ext = path.extname(file).toLowerCase();
            const tempFilePath = filePath + '.tmp';
            
            try {
                // Backup original before processing (just in case)
                fs.copyFileSync(filePath, path.join(backupDir, file));

                const image = sharp(filePath);
                const metadata = await image.metadata();

                let pipeline = image;

                // Resize only if width is greater than 1920px
                if (metadata.width > 1920) {
                    pipeline = pipeline.resize(1920, null, { withoutEnlargement: true });
                }

                // Apply compression depending on format
                if (ext === '.jpg' || ext === '.jpeg') {
                    pipeline = pipeline.jpeg({ quality: 80, progressive: true, mozjpeg: true });
                } else if (ext === '.png') {
                    pipeline = pipeline.png({ quality: 80, compressionLevel: 9, palette: true });
                }

                // Write to temp file
                await pipeline.toFile(tempFilePath);
                
                // Replace original with optimized version
                fs.renameSync(tempFilePath, filePath);
                
                const oldSize = stat.size / 1024 / 1024;
                const newSize = fs.statSync(filePath).size / 1024 / 1024;
                console.log(`✅ ${file}: ${oldSize.toFixed(2)}MB -> ${newSize.toFixed(2)}MB`);

            } catch (err) {
                console.error(`❌ Error optimizing ${file}:`, err);
                if (fs.existsSync(tempFilePath)) {
                    fs.unlinkSync(tempFilePath);
                }
            }
        }
    }
}

console.log('Starting image optimization...');
optimizeImages(imagesDir).then(() => {
    console.log('✨ Optimization complete! Original images backed up to public/images_backup');
});
