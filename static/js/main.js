jQuery(()=>{
    loadFiles();
    setupStartQuizBtn();
})

let selectedQuiz=[];


function loadFiles(){
    $.get('/api/get_quizzes',(data)=>{
        let i=0;
        console.log(data);
        data.forEach((quizname)=>{
            if(i%3==0){
                $('#card-container').append(`<div class="row" id=row-card-`+ i%3 + `>`);
            }
            card = $(`<div class="card col-4" style="" id="card-quiz-`+quizname.replace(" ","_")+`"></div>`);
            cardBody = $(`<div class="card-body"></div>`);
            cardTitle = $(`<h5 class="card-title" id="quiz-`+quizname.replace(" ","_")+`">`+quizname+`</h5>`);
            cardText = $(`<p class="card-text"></p>`);
            cardBtnRename = $(`<input type="button" value="Rinomina" class="btn btn-primary me-1">`);
            cardBtnDelete = $(`<input type="button" value="Elimina" class="btn btn-danger ms-1">`);
            cardBtnStartQuiz = $(`<input type="button" value="Prova quiz" class="btn btn-success ms-2 me-1">`);
            cardBtnSelectQuiz = $(`<input type="button" value="Seleziona"  class="btn ms-2 me-1" style="background-color:orange; color:white">`);

            cardBtnRename.on('click',()=>{
                $("#modalRename").modal('show');
                $("#modalRenameTitle").text("Rinomina quiz");
                $("#inputRename").val(quizname);
                $("#btnSaveRename").on('click',()=>{
                    $.ajax({
                        url: '/api/rename_quiz',
                        type: 'POST',
                        data: {old_name: quizname, new_name: $("#inputRename").val()},
                        success: function(data){
                            // $("#spanStatus").text("Miao");
                            $("#modalRename").modal('hide');
                            $("#card-container").empty();
                            loadFiles();
                        },
                        error: function(data){
                            $("#spanStatus").text("Si è verificato un errore")
                        }
                    })
                })
            
            })

            cardBtnDelete.on('click',()=>{
                $("#modalDelete").modal('show');
                $("#btnDeleteQuiz").on('click',()=>{
                    $.ajax({
                        url: '/api/delete_quiz',
                        type: 'POST',
                        data: {name: quizname},
                        success: function(data){
                            $("#modalDelete").modal('hide');
                            $("#card-container").empty();
                            loadFiles();
                        },
                        error: function(data){
                            $("#spanStatusDelete").text("Si è verificato un errore")
                        }
                    })
                });
                
            })
            cardBtnSelectQuiz.on('click',()=>{
                console.log(quizname);
                selQuiz = $("#card-quiz-"+quizname.replace(" ","_"));
                console.log(selQuiz);
                if(selectedQuiz.includes(quizname)){
                    selectedQuiz = selectedQuiz.filter((quiz)=>{return quiz!=quizname});
                    selQuiz.css("background-color","white");
                    if(selectedQuiz.length==0){
                        $("#btnStartQuizHeader").attr("disabled",true);
                    }
                    
                } else{
                    selectedQuiz.push(quizname);
                    selQuiz.css("background-color","green");
                    $("#btnStartQuizHeader").attr("disabled",false);
                }
            })

            cardBtnStartQuiz.on('click',()=>{
                selectedQuiz = [];
                selectedQuiz.push(quizname);
                href = buildQuizURL(selectedQuiz);
                window.location.href = href;
            })

            cardTitle.appendTo(cardBody);
            cardText.appendTo(cardBody);
            cardBody.append(cardBtnRename);
            cardBody.append(cardBtnDelete);
            cardBody.append(cardBtnStartQuiz);
            cardBody.append(cardBtnSelectQuiz);
            cardBody.appendTo(card);

            card.appendTo($('#row-card-'+i%3));
            
        })
    })
}

function setupStartQuizBtn(){
    $("#btnStartQuizHeader").on('click',()=>{
        if(selectedQuiz.length==0){
            
            return;
        }
        href = buildQuizURL(selectedQuiz);
        window.location.href = href;
    })
}

function buildQuizURL(quiz){
    href = "/html/quiz.html?";
    quiz.forEach((q)=>{
        href += q+"&";
    })
    href = href.substring(0,href.length-1);
    return href;
}