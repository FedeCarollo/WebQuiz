jQuery(()=>{
    $.get('/api',(data)=>{
        console.log(data);
    })
    loadFiles();
})


function loadFiles(){
    $.get('/api/get_quizzes',(data)=>{
        let i=0;
        console.log(data);
        data.forEach((quizname)=>{
            if(i%3==0){
                $('#card-container').append(`<div class="row" id=row-card-`+ i%3 + `>`);
            }
            card = $(`<div class="card col-4" style=""></div>`);
            cardBody = $(`<div class="card-body"></div>`);
            cardTitle = $(`<h5 class="card-title" id="quiz-`+quizname+`">`+quizname+`</h5>`);
            cardText = $(`<p class="card-text"></p>`);
            cardBtnRename = $(`<input type="button" value="Rinomina" class="btn btn-primary me-1">`);
            cardBtnDelete = $(`<input type="button" value="Elimina" class="btn btn-danger ms-1">`);
            cardBtnStartQuiz = $(`<input type="button" value="Prova quiz" class="btn btn-success ms-2 me-1">`);

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

            cardTitle.appendTo(cardBody);
            cardText.appendTo(cardBody);
            cardBody.append(cardBtnRename);
            cardBody.append(cardBtnDelete);
            cardBody.append(cardBtnStartQuiz);
            cardBody.appendTo(card);
            card.appendTo($('#row-card-'+i%3));
        })
    })
}