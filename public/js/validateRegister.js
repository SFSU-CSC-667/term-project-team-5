function validateForm()
{
	var passwrd = document.forms["register"]["password"].value;
	var confirmp = document.forms["register"]["confirm"].value;
	if (confirmp=="" || confirmp==null) {
		alert("Please confirm your password!");
		return false;
	} else {
		if(passwrd != confirmp){
			alert("Passwords do not match! Try again!");
			return false;
		}
	}
}
