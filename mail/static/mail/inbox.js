document.addEventListener("DOMContentLoaded", function () {
  // Use buttons to toggle between views
  document
    .querySelector("#inbox")
    .addEventListener("click", () => load_mailbox("inbox"));
  document
    .querySelector("#sent")
    .addEventListener("click", () => load_mailbox("sent"));
  document
    .querySelector("#archived")
    .addEventListener("click", () => load_mailbox("archive"));
  document.querySelector("#compose").addEventListener("click", compose_email);

  // Handle compose email form functionality
  document.querySelector("#compose-form").onsubmit = send_email;

  // By default, load the inbox
  load_mailbox("inbox");
});

function send_email() {
  const recipients = document.querySelector("#compose-recipients").value;
  const subject = document.querySelector("#compose-subject").value;
  const body = document.querySelector("#compose-body").value;

  //Make a POST request to /emails to register the email
  fetch("/emails", {
    method: "POST",
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body,
    }),
  })
    .then((response) => response.json())
    .then((result) => {
      // Print result
      console.log(result);
    })
    .catch((error) => {
      console.log("Error:", error);
    });

  //Load the user's sent mailbox
  load_mailbox("sent");
}

function compose_email() {
  // Show compose view and hide other views
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "block";
  document.querySelector("#single-email-view").style.display = "none";

  // Clear out composition fields
  document.querySelector("#compose-recipients").value = "";
  document.querySelector("#compose-subject").value = "";
  document.querySelector("#compose-body").value = "";
}

function load_mailbox(mailbox) {
  console.log(mailbox);
  // Show the mailbox and hide other views
  document.querySelector("#emails-view").style.display = "block";
  document.querySelector("#compose-view").style.display = "none";
  document.querySelector("#single-email-view").style.display = "none";

  // Show the mailbox name
  document.querySelector("#mailbox-header").innerHTML =
    mailbox.charAt(0).toUpperCase() + mailbox.substr(1).toLowerCase();

  // Clear the list of emails
  document.getElementById("emails").innerHTML = "";

  // GET the appropriate emails
  fetch(`/emails/${mailbox}`)
    .then((response) => response.json())
    .then((emails) => {
      // Print emails
      console.log(emails);

      if (Object.keys(emails).length == 0) {
        // Show message saying there aren't emails
        const message = document.createElement("h5");
        message.innerHTML = "No mail currently";
        document.querySelector("#emails").innerHTML = message.innerHTML;
        console.log("no emails");
      } else {
        // Show the mail in the mailbox
        console.log(`Going throughs emails in ${mailbox}`);
        emails.forEach((element) => {
          console.log(element);

          const email = document.createElement("div");
          emailClass = element.read ? "email-read" : "email-unread";
          console.log(`emailclass is ${emailClass}`);
          email.setAttribute("class", `row ${emailClass}`);
          if (mailbox === "sent") {
            // Show emails without archive button
            email.innerHTML = `
              <div class = "column" > 
              <p class = "subject">${element.sender} </p>
              <p> Subject: ${element.subject} </p>
              </div> 

              <div class = "column" style = "text-align : right; padding: 5px;"> 
               <p> ${element.timestamp} </p>
              
              </div> 
            `;
          } else {
            let buttonText = element.archived ? "Unarchive" : "Archive";
            email.innerHTML = `
              <div class = "column" > 
              <p class = "subject">${element.sender} </p>
              <p> Subject: ${element.subject} </p>
              </div> 

              <div class = "column" style = "text-align : right; padding: 5px;"> 
               <p> ${element.timestamp} </p>
               <button class="archive-button btn btn-sm btn-outline-primary" data-email="${element.id}"> ${buttonText}</button>
              </div> 
            `;
          }

          // Define onclick function for each email
          email.onclick = () => {
            // Mark as read if needed
            if (!element.read) {
              fetch(`/emails/${element.id}`, {
                method: "PUT",
                body: JSON.stringify({
                  read: true,
                }),
              });
            }

            // Go to the read email page
            load_email(element.id);
          };
          console.log(email);
          document.querySelector("#emails").append(email);
        });
      }
    })
    .then((response) => {
      // Add onClick functions to each of the archive buttons
      if (mailbox != "sent") {
        // Set onclick function for archive button
        document.querySelectorAll(".archive-button").forEach((button) => {
          button.onclick = (event) => {
            console.log(
              `clicked archive button for email id ${button.dataset.email}`
            );
            fetch(`/emails/${button.dataset.email}`, {
              method: "PUT",
              body: JSON.stringify({
                archived: mailbox == "archive" ? false : true,
              }),
            })
              .then((response) => {
                event.cancelBubble = true;
              })
              .then((response) => {
                console.log(
                  `Email ${button.dataset.email} was marked ${
                    mailbox == "archive" ? false : true
                  } for archived`
                );
              })
              .then((response) => {
                load_mailbox("inbox");
              });
          };
        });
      }
    })
    .catch((error) => {
      console.log("Error:", error);
    });
}

function load_email(email_id) {
  // Show single email view and hide other views
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "none";
  document.querySelector("#single-email-view").style.display = "block";

  fetch(`/emails/${email_id}`)
    .then((response) => response.json())
    .then((email) => {
      // Print email
      console.log(email);

      //Fill in the appropriate info for the email
      set_innerHTML("email-sender", email.sender);
      set_innerHTML("email-recipients", `to ${email.recipients}`);
      set_innerHTML("email-subject", email.subject);
      set_innerHTML("email-time", email.timestamp);
      set_innerHTML("email-body", email.body);

      //Add onClick method to the reply button
      document.querySelector("#reply-button").onclick = () => {
        reply(email);
      };
    });
}

function reply(email) {
  console.log(email);
  // Show compose view and hide other views
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "block";
  document.querySelector("#single-email-view").style.display = "none";

  // Fill in the starting information
  document.querySelector("#compose-recipients").value = email.sender;
  if (email.subject.startsWith("Re:")) {
    document.querySelector("#compose-subject").value = email.subject;
  } else {
    document.querySelector("#compose-subject").value = `Re: ${email.subject}`;
  }
  document.querySelector(
    "#compose-body"
  ).value = `On ${email.timestamp} ${email.sender} wrote: "${email.body}"`;
}

function set_innerHTML(id, text) {
  document.querySelector(`#${id}`).innerHTML = text;
}
