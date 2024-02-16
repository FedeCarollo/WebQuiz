let numQuestions = null;
let currentQuestion = null;
let current_index = 0;
let selected = null;

jQuery(() => {
    let params = window.location.search.substring(1).split("&").map((param) => {
        return param.replace("%20", " "); 
    });
    params = params.filter((param) => {return param != ""});
    if(params.length==0) {
        window.location.href = "/";
    }

    for(let i=0; i<4; i++){
        $("#btnAns"+i).on("click", () => {
            if(selected!=i){
                if(selected!=null){
                    $("#btnAns"+selected).removeClass("btn-light").addClass("btn-outline-light");
                }
                selected = i;
                $("#btnAns"+i).removeClass("btn-outline-light").addClass("btn-light");
                
            } else{
                selected = null;
                $("#btnAns"+i).removeClass("btn-light").addClass("btn-outline-light");
            }
        })
    }

    $.ajax({
        url: "/api/start_quiz",
        type: "GET",
        data: {quiznames: params},
        success: (data) => {
            $("#container-box").css("display", "block");
            numQuestions = data.numQuestions;
            askQuestion();
        },
        error: (jqXHR, textStatus, errorThrown) => {
            window.location.href = "/";
            console.log(jqXHR);
            console.log(textStatus);
            console.log(errorThrown);
        }
    })


    $("#btnNext").on("click", () => {
        $.post("/api/answer", {answer: selected}, (data) => {
            refreshButtons();
            askQuestion();
        });
    });

    $("#btnPrevious").on("click", () => {
        $.post("/api/answer", {answer: selected}, (data) => {
            refreshButtons();
            askQuestion(false);
        });
    })

    $("#btnBackHome").on("click", () => {
        $.post("/api/close_quiz", null, (data) => {
            console.log(data);
        });
        window.location.href = "/";
    })
})

function buildQuizURL(quiz){
    url_params = "&";
    quiz.forEach((q)=>{
        url_params += q+"&";
    })
    url_params = url_params.substring(0,url_params.length-1);
    return url_params;
}

function askQuestion(next=true){
    $.ajax({
        url: next?"/api/next_question":"/api/previous_question",
        type: "GET",
        success: (data) => {
            console.log(data);
            selected = null;
            current_question = data.question;
            numQuestions = data.numQuestions;
            current_index = data.currentQuestion;
            if(current_index > 0){
                $("#btnPrevious").attr("disabled", false);
            } else{
                $("#btnPrevious").attr("disabled", true);
            }

            $("#question").text("Domanda: " + current_question.question);
            for(let i=0; i<current_question.answers.length; i++){
                $("#btnAns"+i).text(current_question.answers[i]);
            }
            refreshButtons();
            if(data.question.selected!=null){
                selected = data.question.selected;
                $("#btnAns"+selected).removeClass("btn-outline-light").addClass("btn-light");
            }

            if(current_index==numQuestions-1){
                $("#btnNext").text("Consegna");
                $("#btnNext").off("click");
                $("#btnNext").on("click", () => {

                    $.post("/api/answer", {answer: selected}, (data) => {
                        $.post("/api/end_quiz", null, (data) => {
                            $("#container-box").css("display", "none");
                            $("#container-btns").css("display", "none");
                            $("#container-recap").css("display", "block");
                            console.log(data.results);
                            writeRecap(data.results);
                        });
                        
                    });
                });
            } else {
                $("#btnNext").text("Continua");
                $("#btnNext").off("click");
                $("#btnNext").on("click", () => {
                    $.post("/api/answer", {answer: selected}, (data) => {
                        selected = null;
                        refreshButtons();
                        askQuestion();
                    });
                });
            }
        }, error: (jqXHR, textStatus, errorThrown) => {
            console.log(jqXHR);
            console.log(textStatus);
            console.log(errorThrown);
        }
    })
}

function refreshButtons(){
    selected = null;
    for(let i=0; i<4; i++){
        $("#btnAns"+i).removeClass("btn-light").addClass("btn-outline-light");
    }
}

function writeRecap(questions){
    $("#recap-container").empty();
    correct = questions.filter((question) => {return question.result=="correct"}).length;
    wrong = questions.filter((question) => {return question.result=="wrong"}).length;
    unanswered = questions.filter((question) => {return question.result=="unanswered"}).length;
    questions.forEach((question) => {
        let result = question.result;
        let color = "black";
        if(result=="correct"){
            color = "green";
        } else if(result=="wrong"){
            color = "red";
        } else{
            color = "blue";
        }
        let text = "<div class='recap-question mt-4 mb-4 bg-white w-50'><p>Domanda: "+question.question+"</p>";
        text += "<p class='font-weight-bold' style='color:"+color+"'>Risposta: "+ (question.selected != null? question.selected:"Non data") + "</p>";
        text += "<p class='font-weight-bold' style='color:green'>Corretta: "+question.correct+"</p></div>";
        $("#recap-container").append(text);
    })
    $("#correct").text("Corrette: " + correct);
    $("#wrong").text("Errate: " + wrong);
    $("#unanswered").text("Non risposte: " + unanswered);
    $("#score").text("Punteggio: " + correct + "/" + questions.length);
}