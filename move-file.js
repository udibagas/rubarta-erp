const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

const baseURL =
  'https://rubarta-erp-production.up.railway.app/api/file/move-file';

async function login() {
  const response = await axios.post(
    'https://rubarta-erp-production.up.railway.app/api/auth/login',
    {
      email: 'udibagas@gmail.com',
      password: 'bismillah',
    },
  );
  return response.data;
}

async function moveFile(filePath, token) {
  const formData = new FormData();
  formData.append('file', fs.createReadStream(filePath));

  try {
    const response = await axios.post(baseURL, formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${token}`,
      },
    });
    console.log(
      `✓ File moved successfully: ${path.basename(filePath)}`,
      response.data,
    );
    return { success: true, data: response.data, file: filePath };
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    console.error(`✗ Error moving file ${path.basename(filePath)}:`, errorMsg);
    return { success: false, error: errorMsg, file: filePath };
  }
}

async function scanDirectoryRecursively(
  dir,
  token,
  results = { success: 0, failed: 0, errors: [] },
) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        console.log(`Scanning directory: ${fullPath}`);
        await scanDirectoryRecursively(fullPath, token, results);
      } else if (entry.isFile()) {
        if (entry.name === '.DS_Store') continue; // Skip system files
        console.log(`Processing file: ${fullPath}`);
        const result = await moveFile(fullPath, token);

        if (result.success) {
          results.success++;
        } else {
          results.failed++;
          results.errors.push({ file: fullPath, error: result.error });
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dir}:`, error.message);
    results.errors.push({ directory: dir, error: error.message });
  }

  return results;
}

async function scanAndMoveFiles() {
  try {
    const { token } = await login();
    console.log('Logged in successfully, starting file move process\n');
    const uploadsDir = './uploads';

    if (!fs.existsSync(uploadsDir)) {
      console.error('Uploads directory does not exist');
      return;
    }

    console.log(`Starting recursive scan of ${uploadsDir}`);
    const results = await scanDirectoryRecursively(uploadsDir, token);

    console.log('\n=== SUMMARY ===');
    console.log(`✓ Successfully moved: ${results.success} files`);
    console.log(`✗ Failed: ${results.failed} files`);

    if (results.errors.length > 0) {
      console.log('\nErrors:');
      results.errors.forEach(({ file, directory, error }) => {
        if (file) console.log(`  - ${file}: ${error}`);
        if (directory) console.log(`  - Directory ${directory}: ${error}`);
      });
    }

    console.log('\nAll files processed');
  } catch (error) {
    console.error('\n✗ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the script
scanAndMoveFiles().catch(console.error);
