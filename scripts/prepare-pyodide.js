const packages = [
    'micropip',
    'packaging',
    'scipy',
    'numpy'
];

import { writeFile, readFile, copyFile, mkdir} from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function copyPyodideFiles() {
    console.log('Copying Pyodide files...');

    // Create static directory if it doesn't exist
    if (!existsSync('static')) {
        await mkdir('static', { recursive: true });
    }

    if (!existsSync('static/pyodide')) {
        await mkdir('static/pyodide', { recursive: true });
    }

    // Copy pyodide files from node_modules
    const pyodidePath = path.join(__dirname, '..', 'node_modules', 'pyodide');

    try {
        // Copy essential pyodide files
        await copyFile(
            path.join(pyodidePath, 'pyodide.js'),
            path.join('static', 'pyodide', 'pyodide.js')
        );

        await copyFile(
            path.join(pyodidePath, 'pyodide.asm.js'),
            path.join('static', 'pyodide', 'pyodide.asm.js')
        );

        await copyFile(
            path.join(pyodidePath, 'pyodide.asm.wasm'),
            path.join('static', 'pyodide', 'pyodide.asm.wasm')
        );

        await copyFile(
            path.join(pyodidePath, 'pyodide_py.tar'),
            path.join('static', 'pyodide', 'pyodide_py.tar')
        );

        await copyFile(
            path.join(pyodidePath, 'pyodide.asm.data'),
            path.join('static', 'pyodide', 'pyodide.asm.data')
        );

        // Copy repodata.json which contains package metadata
        await copyFile(
            path.join(pyodidePath, 'repodata.json'),
            path.join('static', 'pyodide', 'repodata.json')
        );

        // Copy available package wheels and dependencies
        const filesToCopy = [
            'scipy-1.8.1-cp310-cp310-emscripten_3_1_14_wasm32.whl',
            'numpy-1.22.4-cp310-cp310-emscripten_3_1_14_wasm32.whl',
            'distutils.tar',
            'CLAPACK-3.2.1.zip',
            'pyodide_tblib-1.7.1-py3-none-any.whl'
        ];

        for (const fileName of filesToCopy) {
            const srcPath = path.join(pyodidePath, fileName);
            const destPath = path.join('static', 'pyodide', fileName);

            try {
                await copyFile(srcPath, destPath);
                console.log(`✓ Copied ${fileName}`);
            } catch (err) {
                console.log(`⚠ Could not copy ${fileName} (may not exist locally)`);
            }
        }

        console.log('✓ Pyodide core files copied');

    } catch (err) {
        console.error('Error copying pyodide files:', err);
        throw err;
    }
}

async function createLockFile() {
    const packageJson = JSON.parse(await readFile('package.json', 'utf8'));
    const pyodideVersion = packageJson.dependencies.pyodide.replace(/^\^/, '');

    console.log(`Using Pyodide version: ${pyodideVersion}`);

    // Write package lock file
    const lockFile = {
        pyodideVersion: pyodideVersion,
        packages: packages,
        timestamp: new Date().toISOString(),
        note: "Packages are preloaded from local pyodide distribution"
    };

    await writeFile('static/pyodide-lock.json', JSON.stringify(lockFile, null, 2));
    console.log('✓ Package lock file created');

    console.log('Pyodide setup complete! Packages preloaded for offline use.');
}

async function main() {
    try {
        await copyPyodideFiles();
        await createLockFile();
    } catch (err) {
        console.error('Failed to prepare pyodide:', err);
        process.exit(1);
    }
}

main();