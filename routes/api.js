const router = require('express').Router();
const fs = require('fs');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: "resources/files/",
    filename: function(req, file, cb){
        const ext = path.extname(file.originalname);
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

router.get("/start_quiz", (req, res) => {
    let params = req.query.quiznames;
    if(params.length==0) {
        res.redirect('/');
    }

    let quizzes = JSON.parse(fs.readFileSync('resources/json/quizzes.json'));
    let quiz_paths = quizzes["quizzes"].map((quiz)=>{
        if(params.indexOf(quiz["name"])!=-1){
            return quiz["path"];
        }
    });
    if(quiz_paths.length==0){
        res.redirect('/');
        return;
    }
    let questions = [];
    quiz_paths.forEach(path => {
        f = fs.readFileSync(path, 'utf8')
        f.split('\n').forEach((line)=>{
            if(line.trim()!=""){
                questions.push({question: line.split(',')[0], answers: [line.split(",")[1].trim("\r")], correct: line.split(',')[1].trim("\r"), selected: null});
            }
        });
    });
    answers = questions.map((question)=>{
        return question["correct"];
    });

    let sAnswer = new Set(answers);
    if(sAnswer.size<4){
        res.status(400).json({error: "Non ci sono abbastanza associazioni per generare un quiz"});
        return;
    }

    questions.forEach((question)=>{
        let temp = question["answers"];
        while(temp.length<4){
            let random = answers[Math.floor(Math.random() * answers.length)];
            if(temp.indexOf(random)==-1){
                temp.push(random);
            }
        }
        question["answers"] = temp.sort(() => Math.random() - 0.5);
    });
    questions = questions.sort(() => Math.random() - 0.5);
    req.session.questions = questions;
    console.log(req.session.questions);
    req.session.numQuestions = questions.length;    //TODO: set by user
    req.session.currentQuestion = -1;
    res.status(200).json({numQuestions: req.session.numQuestions});
});

router.get("/next_question", (req, res) => {
    if(!req.session.questions || req.session.questions.length==0){
        console.log("No questions");
        res.redirect('/');
    }
    req.session.currentQuestion++;
    if(req.session.currentQuestion>=req.session.numQuestions){
        res.status(400).json({error: "No more questions"});
        return;
    }
    let question = req.session.questions[req.session.currentQuestion];
    question = {question: question["question"], answers: question["answers"], selected: question["selected"]};
    res.status(200).json({question: question, currentQuestion: req.session.currentQuestion, numQuestions: req.session.numQuestions});
})

router.get("/previous_question", (req, res) => {
    if(!req.session.questions || req.session.questions.length==0){
        console.log("No questions");
        res.redirect('/');
    }
    req.session.currentQuestion--;
    if(req.session.currentQuestion<0){
        res.status(400).json({error: "No more questions"});
        return;
    }
    let question = req.session.questions[req.session.currentQuestion];
    question = {question: question["question"], answers: question["answers"], selected: question["selected"]};
    res.status(200).json({question: question, currentQuestion: req.session.currentQuestion, numQuestions: req.session.numQuestions});
});

router.post("/answer", (req, res) => {
    if(!req.session.questions || req.session.questions.length==0){
        console.log("No questions");
        res.redirect('/');
    }
    if(req.session.currentQuestion>=req.session.numQuestions){
        res.status(400).json({error: "No more questions"});
        return;
    }
    req.session.questions[req.session.currentQuestion]["selected"] = req.body.answer;
    res.status(200).json({message: "Answer saved"});
});

router.post("/end_quiz", (req, res) => {
    if(!req.session.questions || req.session.questions.length==0){
        console.log("No questions");
        res.redirect('/');
    }
    results = checkResults(req.session.questions);
    saveLog(req.session, results);
    req.session.questions[req.session.currentQuestion]["selected"] = req.body.answer;
    req.session.questions = [];
    req.session.numQuestions = 0;
    req.session.currentQuestion = -1;
    res.status(200).json({results: results});
});

router.post("/close_quiz", (req, res) => {
    req.session.questions = [];
    req.session.numQuestions = 0;
    req.session.currentQuestion = -1;
    res.status(200).json({message: "Quiz ended"});
});


function checkResults(questions){
    results = questions.map((question)=>{
        let res;
        let selected = question["selected"] == null? null:question["answers"][question["selected"]];
        if(selected==question["correct"]){
            res = "correct";
        } else if(selected==null){
            res = "unanswered";
        } else {
            res = "wrong";
        }
        return {question: question["question"], selected: question["selected"]!=null? question["answers"][question["selected"]]:null, correct: question["correct"], result: res};
    })
    return results
}

function saveLog(session, results){
    let right = results.filter((question) => {return question.result=="correct"}).length;
    let wrong = results.filter((question) => {return question.result=="wrong"}).length;
    let ng = results.filter((question) => {return question.result=="unanswered"}).length;
    let log = {date: new Date(), /*questions: session.questions,*/ numQuestions: session.numQuestions, right: right, wrong: wrong, ng: ng};
    logFile = JSON.parse(fs.readFileSync('resources/log/log.json'));
    logFile["log"].push(log);
    fs.writeFileSync('resources/log/log.json',JSON.stringify(logFile, null, "\t"));
    
}


module.exports=router