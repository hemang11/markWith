window.onload = () => {
    $("form.login").submit((event) => {
        event.preventDefault();
        const formData = {
            "email": $("#email-login").val(),
            "password": $("#password-login").val()
        };
        $.ajax({
            type: "POST",
            url: "/api/user/login",
            "data": formData,
            "encode": true,
            success: (response) => {
                console.log(response);
                if (response.success === true) {
                    window.location.replace("/documents");
                } else {
                    showLoginError();
                }
            },
            error: (err) => {
                console.log(err);
                showLoginError();
            }
        });
    });
}

const showLoginError = () => {
    const messageListItem = $("li#message");
    $("div.messages").show();
    messageListItem.empty();
    messageListItem.text("Login failed, please try again");
};