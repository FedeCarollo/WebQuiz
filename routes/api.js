const router = require('express').Router();
const fs = require('fs');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: "resources/files/",
    filename: function(req, file, cb){
        const ext = path.extname(file.originalname);
        const new_name=req.body.name+ext;
        cb(null, file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: {fileSize: 8192},
    fileFilter: function(req, file, cb){
        const ext = path.extname(file.originalname);
        if(!/\.txt|\.rtf/.test(ext.toLowerCase())){
            return cb(new Error("File extension not valid"), false);
        }
        file.originalname = "quizfile_" + Date.now() + ext;
        cb(null, true);
    },
    onError: function(err, next){
        console.log('error', err);
        next(err);
    }
    

});

router.get('/', (req, res) => {
  res.send('works');
});

router.get('/get_quizzes', (req, res) => {
  files = JSON.parse(fs.readFileSync('resources/json/quizzes.json'));
  files = files["quizzes"].map((file)=>{
    return file["name"];
  });
    res.status(200).json(files);
});

router.post('/upload_quiz', (req, res) => {
    upload.single('file')(req, res, (err)=>{
        if(err){
            res.status(400).json({error: "Errore nel caricamento del file. " + err.message});
        }
        else{
            let quizzes = JSON.parse(fs.readFileSync('resources/json/quizzes.json'));
            if(quizzes["quizzes"].find((quiz)=>{return quiz["name"]==req.body.name})){
                fs.unlinkSync(req.file.path)
                res.status(400).json({error: "Nome del quiz già esistente"});
                return;
            }

            quizzes["quizzes"].push({name: req.body.name, path: req.file.path});
            fs.writeFileSync('resources/json/quizzes.json',JSON.stringify(quizzes, null, "\t"));
            res.status(200).json({message: "File caricato con successo"});
        }
    });
});

router.post('/rename_quiz', (req, res) => {
    let quizzes = JSON.parse(fs.readFileSync('resources/json/quizzes.json'));
    let index = quizzes["quizzes"].findIndex((quiz)=>{return quiz["name"]==req.body.old_name});
    if(index==-1){
        res.status(400).json({error: "Quiz non trovato"});
        return;
    }
    quizzes["quizzes"][index]["name"]=req.body.new_name;
    fs.writeFileSync('resources/json/quizzes.json',JSON.stringify(quizzes, null, "\t"));
    res.status(200).json({message: "Quiz rinominato con successo"});
});

router.post('/delete_quiz', (req, res) => {
    let quizzes = JSON.parse(fs.readFileSync('resources/json/quizzes.json'));
    let index = quizzes["quizzes"].findIndex((quiz)=>{return quiz["name"]==req.body.name});
    if(index==-1){
        res.status(400).json({error: "Quiz non trovato"});
        return;
    }
    fs.unlinkSync(quizzes["quizzes"][index]["path"]);
    quizzes["quizzes"].splice(index,1);
    fs.writeFileSync('resources/json/quizzes.json',JSON.stringify(quizzes, null, "\t"));
    res.status(200).json({message: "Quiz eliminato con successo"});
});




module.exports=router