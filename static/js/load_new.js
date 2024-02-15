jQuery(()=>{
    $("#inputFile").on('change',(e)=>{
        let file = e.target.files[0];
        if(file){
            $("#btnVisibleFile").removeClass("btn-danger").addClass("btn-primary");
            $("#spanFilename").text(file.name);
        } else{
            $("#btnVisibleFile").removeClass("btn-primary").addClass("btn-danger");
            $("#spanFilename").text("Nessun file selezionato");
        }
            
    })

    $("#inputQuizname").on('input',()=>{
        if($("#inputQuizname").val()!=""){
            $("#inputQuizname").removeClass("is-invalid");
            $("#btnUpload").removeClass("btn-danger").addClass("btn-primary");
        } else{
            $("#inputQuizname").addClass("is-invalid");
        }
    })

    $("#btnUpload").on('click',(e)=>{
        e.preventDefault();
        
        let file = $("#inputFile")[0].files[0];
        let formData = new FormData();
        let valid=true;

        if(!file){
            $("#btnVisibleFile").removeClass("btn-primary").addClass("btn-danger");
            valid=false;
        }
        if(checkFileValidity(file)===false){
            $("#btnVisibleFile").removeClass("btn-primary").addClass("btn-danger");
            valid=false;
        }
        if($("#inputQuizname").val()==""){
            $("#inputQuizname").addClass("is-invalid");
            $("#btnUpload").removeClass("btn-primary").addClass("btn-danger");
            valid=false;
        }
        if(!valid)
            return;

        formData.append('file',file);
        formData.append('name',$("#inputQuizname").val());
        $.ajax({
            url: '/api/upload_quiz',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            
            success: function(data){
                $("#spanStatus").text(data.message);
                $("#spanStatus").removeClass("text-danger").addClass("text-success");
            }, 
            error: function(data){
                $("#spanStatus").text(data.responseJSON.error);
                $("#spanStatus").removeClass("text-success").addClass("text-danger");
            }
        })
    });
    
})


function checkFileValidity(file){
    let valid=true;
    if(!file){
        return false;
    }
    if(file.size>8192){
        valid=false;
    }
    if(file.type!=="text/plain"){
        valid=false;
    }
    return valid;
}