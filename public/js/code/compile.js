var submit = 'http://2fd2a00c.compilers.sphere-engine.com/api/v3/submissions';

function showLoading () {
    $('.code-form').prop ('disabled', true);
    $('.compilation-alert').hide ();
    $('#output').empty ();
    $('#output').hide ();
}

function hideLoading () {
    $('.code-form').prop ('disabled', false);
}

function postResult (data) {
    $.post ('/api/submission/', { 'id': data['id'] });

    $.post ('/api/postresult/', {
        'uri': uri,
        'caret': 0,
        'langId': data['langId'],
        'langName': data['langName'],
        'langVersion': data['langVersion'],
        'time': data['time'],
        'result': data['result'],
        'memory': data['memory'],
        'source': $('#sourceCode').val (),
        'input': $('#input').val (),
        'output': data['output']
    });
}

function displayResult (data) {
    postResult (data);

    if (data['result'] == 15) {
        $('#success-alert').html ("Success! time:" + data['time'] + " memory:" + data['memory']);
        $('#success-alert').show ();
        $('#output').html (data['output']);
        $('#output').show ();
    }
    else {
        var errorText;
        if (data['result'] == 11) {
            errorText = "compilation error";
            $('#cmpinfo-alert').html (data['cmpinfo'].replace ('\n', "<br>"));
            $('#cmpinfo-alert').show ();
        }
        else if (data['result'] == 12) {
            errorText = "runtime error! " + "signal:" + data['signal'];
            $('#stderr-alert').html (data['stderr'].replace ('\n', "<br>"));
            $('#stderr-alert').show ();
        }

        else if (data['result'] == 13) errorText = 'time limit exceeded ' + data['time'] + 's';
        else if (data['result'] == 17) errorText = 'memory limit exceeded ' + data['memory'] + 'kb';
        else if (data['result'] == 19) errorText = 'illegal system call';
        else if (data['result'] == 20) errorText = 'internal error';

        $('#error-alert').html (errorText);
        $('#error-alert').show ();
    }

    hideLoading ();
}

function retrieveResult (id) {
    $.ajax ({
        url: submit + '/' + id,
        data: {
            'access_token': token,
            'withOutput': true,
            'withStderr': true,
            'withCmpinfo': true
        },
        success: function (data) {
            data = [data.slice (0, 1), "\"id\":", id, ",", data.slice (1)].join ('');

            $.post ('/api/convert/', { 'text': data }, function (convert) {
                console.log (convert);
                if (convert['error'] != "OK") {
                    $('#error-alert').html (convert['error']);
                    $('#error-alert').show ();
                    hideLoading ();
                }
                else {
                    var status;
                    if (convert['status'] < 0) status = "waiting...";
                    else if (convert['status'] == 0) status = "Run";
                    else if (convert['status'] == 1) status = "compiling...";
                    else if (convert['status'] == 3) status = "running...";

                    $('#run').html (status);
                    if (convert['status'] == 0) displayResult (convert);
                    else retrieveResult (convert['id']);
                }
            }, 'json');
        },
        error: function (jqXHR, textStatus, errorThrown) {
            $('#error-alert').html (errorThrown);
            $('#error-alert').show ();
            hideLoading ();
        }
    });
}

function run () {
    showLoading ();

    $.ajax ({
        url: submit + '?access_token=' + token,
        type: 'POST',
        data: {
            'sourceCode': $('#sourceCode').val (),
            'language': $('#lang').val (),
            'input': $('#input').val ()
        },
        dataType: 'json',
        success: function (data) {
            retrieveResult (data['id']);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            $('#error-alert').html (errorThrown);
            $('#error-alert').show ();
            hideLoading ();
        }
    });
}
