const archiver = require('archiver');
const fs = require('fs');
const path = require('path');


function zipCurrentDirectory(outputFilename) {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(outputFilename);
        const archive = archiver('zip', {
            zlib: { level: 9 }
        });

        archive.on('error', (err) => {
            reject(err);
        });

        output.on('close', () => {
            console.log(`${outputFilename} has been finalized.`);
            resolve();
        });

        archive.pipe(output);

        // 재귀적으로 폴더와 파일을 탐색하고 압축하는 함수
        function archiveDirectory(directory) {
            fs.readdirSync(directory).forEach(file => {
                const fullPath = path.join(directory, file);

                if (fs.lstatSync(fullPath).isDirectory()) {
                    archiveDirectory(fullPath); // 폴더일 경우 재귀
                } else if (fullPath !== path.resolve(outputFilename)) { // 출력 ZIP 파일 자체는 제외
                    const relativePath = path.relative('.', fullPath);
                    archive.file(fullPath, { name: relativePath });
                }
            });
        }

        archiveDirectory('.'); // 현재 디렉토리부터 시작
        archive.finalize();
    });
}

zipCurrentDirectory('output.zip')
    .then(() => {
        console.log('Files have been successfully zipped!');
    })
    .catch((error) => {
        console.error('Error while zipping:', error);
    });
