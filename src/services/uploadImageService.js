import multer from "multer";
import fs from "fs";

//This defines the folder path where you want to save uploaded files (images).
const uploadFolder = "uploads/images";

if(!fs.existsSync(uploadFolder))
{
    // If the folder does not exist, then fs.mkdirSync() --> creates a new folder synchronously.
    // recursive: true --> ensures all parent folders are created if they don’t exist.
    // Without { recursive: true }: If parent folder is missing, it would throw an error.
    fs.mkdirSync(uploadFolder, {recursive: true});
}

const storage = multer.diskStorage({
    destination: function(req, file, cb)
    {
        cb(null, uploadFolder);
    },

    filename: function(req, file, cb){
        const uniqueName = Date.now() + "-" + file.originalname;
        cb(null, uniqueName);
    }
})

const fileFilter = (req, file, cb) => {
    
    if (file.mimetype.startsWith("image/")) 
    {
        cb(null, true);
    }
    else
    {
        cb(new Error("Only image files are allowed"), false);
    }
};

const upload = multer({
    limits: {fileSize: 3 * 1024 * 1024}, //set limit of file to 3MB
    fileFilter,
    storage,
});

export default upload;