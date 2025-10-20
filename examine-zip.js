import AdmZip from 'adm-zip';
import { readFileSync } from 'fs';

const zipPath = 'attached_assets/piximmo-cogvlm-skeleton_v4.1_1760962688236.zip';

try {
  const zip = new AdmZip(zipPath);
  const zipEntries = zip.getEntries();
  
  console.log(`\n📦 ZIP contains ${zipEntries.length} files:\n`);
  
  zipEntries.forEach((entry, idx) => {
    if (!entry.isDirectory) {
      console.log(`${idx + 1}. ${entry.entryName} (${(entry.header.size / 1024).toFixed(1)} KB)`);
    }
  });
  
  // Show first 5 files in detail
  console.log(`\n📋 Sample filenames (first 5):\n`);
  zipEntries.slice(0, 5).forEach(entry => {
    if (!entry.isDirectory) {
      console.log(`   ${entry.entryName}`);
    }
  });
  
} catch (error) {
  console.error('Error reading ZIP:', error.message);
}
