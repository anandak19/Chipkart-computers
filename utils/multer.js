const multer = require('multer')
const path = require('path')

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, "./public/uploads")
//     },
//     filename: (req, file, cb) =>{
//         cb(null, "product"+ '-' + Date.now()+ path.extname(file.originalname))
//     }
// })

const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

const extractPublicId = (url) => {
    const parts = url.split('/');
    const fileName = parts[parts.length - 1].split('.')[0];
    const folder = parts[parts.length - 2]; 
    return `${folder}/${fileName}`;
}

module.exports = {upload, extractPublicId}