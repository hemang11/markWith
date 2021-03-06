window.addEventListener('load', () => {
    const socket = io(); // defined in script include
    const textPad = document.getElementById("text-pad");
    const textMarkdown = document.getElementById("markdown-target");
    const docId = document.getElementById("docId").value;
    const room = docId;
    let emitCursorIndex = 0;

    /* Updates all references to doc name */
    const updateName = (newName) => {
        $("span#docName").html(newName);
        $("input#docName-editable").val(newName);
    };

    /* Populates list of collabs in right nav */
    const populateCollabs = (emailArray) => {
        emailArray.forEach((email) => {
            $("ul#collab-list").prepend(
                    "<li><a class='remove-collab' href='#'><span class='fa"
                    + " fa-minus-circle' aria-hidden='true'></span>" + email
                    + "</a></li>"
            );
        });
    }

    /* Markdown converter */
    const updateMarkdown = () => {
        textMarkdown.innerHTML = marked(textPad.value); // definition from CDN
    };

    /* Get Doc Info */
    $.ajax({
        type: "GET",
        url: "/api/documents/" + docId,
        success: (res) => {
            updateName(res.data.docName);
            populateCollabs(res.data.collabs_emails);
        }
    });

    /* Track emitter's pre-change cursor position */
    textPad.addEventListener('keydown', () => {
        emitCursorIndex = textPad.selectionStart;
    });

    /**
     * Socket.io
     */
     socket.on("connect", () => {
        // Join a test room, e.g. spec'd by path
        socket.emit("room", room);
        /* Listeners */

         // Get current text once connected, bring textpad into focus
         socket.on("populate editor", (currentText) => {
             textPad.value = currentText.contents;
             updateMarkdown();
             textPad.focus();
         });

         // Listen for text change broadcasts from socket server and replace
         // raw text. Move cursor to correct index.
         socket.on("text changed", (data) => {
             // Grab the local cursor position
             const cursorIndex = textPad.selectionStart;
             // Replace textPad text with text from server
             textPad.value = data.newText;
             // Set cursor index based on server data
             if (cursorIndex >= data.cursor) {
                const changeLength = data.newText.length - textPad.value.length;
                const newCursorIndex = cursorIndex + changeLength;
                textPad.setSelectionRange(newCursorIndex, newCursorIndex);
             } else {
                 textPad.setSelectionRange(cursorIndex, cursorIndex);
             }
             // Re-render markdown
             updateMarkdown();
         });

         /* Emiters */

         // Broadcast local text changes to the server and re-render markdown
         textPad.addEventListener("input", () => {
             socket.emit("text changed", {
                 newText: textPad.value, 
                 cursor: emitCursorIndex,
                 docId: room
             });
             updateMarkdown();
         });
     });

    /* Tab-to-space converter */
    textPad.addEventListener("keydown", (event) => {
        if (event.keyCode === 9) {
            event.preventDefault();
            const start = textPad.selectionStart;
            const end = textPad.selectionEnd;
            const text = textPad.value;
            textPad.value = text.substring(0, start) 
                    + "    " // Spaces, not tabs!
                    + text.substring(end);
            textPad.setSelectionRange(start + 4, start + 4);
            // Fire the input eventListener
            textPad.dispatchEvent(new Event("input"));
        }
    });

    // Update doc name in DB when renamed
    $("form#docName-editable-form").on("submit", (event) => {
        event.preventDefault();
        const newName = $("input#docName-editable").val();
        $.ajax({
            type: "POST",
            url: "/api/documents/update/" + docId + "/name",
            data: { "docName": newName },
            encode: true,
            success: (response) => updateName(response.data.docName),
            error: (err) => console.log(err)
        });
    });

    // Remove collaborator
    $("ul#collab-list").on("click", "a", (event) => {
        event.preventDefault();
        const self = $(event.target);
        console.log(self);
        $.ajax({
            type: "POST",
            url: "/api/documents/update/" + docId + "/remove_collab",
            data: {
                "email": self.text()
            },
            encode: true,
            success: () => {
                self.parent().hide();
            },
            error: (err) => {
                console.log(err);
            }
        });
    });

    // Add Collaborator
    $("form#add-collab-form").on("submit", (event) => {
        event.preventDefault();
        const newCollab = $("input#add-collab").val();
        $.ajax({
            type: "POST",
            url: "/api/documents/update/" + docId + "/add_collab",
            data: {
                "email": newCollab
            },
            encode: true,
            success: (res) => {
                if (res.success) {
                    $("ul#collab-list").prepend(
                        "<li><a class='remove-collab' href='#'><span class='fa"
                        + " fa-minus-circle' aria-hidden='true'></span>"
                        + newCollab + "</a></li>"
                    );
                    $("input#add-collab").val("");
                } else {
                    console.log(res);
                }
            },
            error: (err) => console.log(err)
        });
    });

    $("div#delete-document").on('click', 'a', (event) => {
        event.preventDefault();
        $.ajax({
            type: "POST",
            url: "/api/documents/delete/" + docId,
            encode: true,
            success: (res) => {
                if (res.success) {
                    window.location.assign("/documents");
                }
            },
            error: (err) => console.log(err)
        });
    });
});