/**
 * IPMC KART - EXTENSIVE IMAGE CLARITY UPGRADE
 * 
 * This script upscales and sharpens all product and repo images to 2.5K (QHD).
 * It uses the Lanczos3 kernel and custom sharpening for "crispy" results.
 * 
 * USAGE: 
 * node upscale-all-images.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const glob = require('glob');

const TARGET_WIDTH = 2560; // 2.5K Resolution (Optimized for clarity vs speed)
const IMAGE_EXTS = ['webp', 'jpg', 'jpeg', 'png'];

async function upscaleAll() {
    const pattern = `assets/images/**/*.{${IMAGE_EXTS.join(',')}}`;
    const files = glob.sync(pattern);
    
    console.log(`🚀 Starting Extensive Clarity Upgrade...`);
    console.log(`📁 Found ${files.length} total images in /assets/images/`);
    console.log(`✨ Target: ${TARGET_WIDTH}px (Lanczos3 Resampling + Detail Sharpening)\n`);

    let processed = 0;
    let skipped = 0;
    let errors = 0;
    let totalSizeSaved = 0;

    for (const file of files) {
        try {
            // 1. Get metadata to check if we should skip
            const metadata = await sharp(file).metadata();
            
            // Skip icons (<100px) and already large images (>=TARGET_WIDTH)
            if (metadata.width >= TARGET_WIDTH || metadata.width < 120) {
                skipped++;
                continue;
            }

            const tmpFile = `${file}.tmp_upscale`;
            
            // 2. High-Performance Processing Pipeline
            let pipeline = sharp(file)
                .resize({ 
                    width: TARGET_WIDTH, 
                    withoutEnlargement: false, 
                    kernel: sharp.kernel.lanczos3 
                })
                .sharpen({
                    sigma: 0.8, // Radius of the blur
                    m1: 0.5,   // Flat area threshold
                    m2: 1.5    // Maximum amount of sharpening
                });

            // 3. Output Optimization
            if (metadata.format === 'webp') {
                await pipeline.webp({ quality: 80, effort: 4 }).toFile(tmpFile);
            } else if (metadata.format === 'jpeg' || metadata.format === 'jpg') {
                await pipeline.jpeg({ quality: 80, mozjpeg: true }).toFile(tmpFile);
            } else {
                await pipeline.toFile(tmpFile);
            }

            // 4. Atomic Replacement
            const oldSize = fs.statSync(file).size;
            fs.renameSync(tmpFile, file);
            const newSize = fs.statSync(file).size;
            
            processed++;
            
            if (processed % 25 === 0) {
                console.log(`[PROGRESS] ${processed}/${files.length} processed... (Skipped: ${skipped})`);
            }

        } catch (err) {
            errors++;
            console.error(`❌ Error processing ${file}: ${err.message}`);
            // Cleanup tmp file if it exists
            if (fs.existsSync(file + '.tmp_upscale')) {
                fs.unlinkSync(file + '.tmp_upscale');
            }
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log('🏁 CLARITY UPGRADE COMPLETE');
    console.log('='.repeat(50));
    console.log(`✅ Upscaled & Sharpened: ${processed}`);
    console.log(`⏩ Skipped (Icons/Large): ${skipped}`);
    console.log(`❌ Failed:               ${errors}`);
    console.log('='.repeat(50));
    console.log('\nNOTE: Run this script again if it gets interrupted.');
}

upscaleAll().catch(err => {
    console.error('Fatal execution error:', err);
    process.exit(1);
});
