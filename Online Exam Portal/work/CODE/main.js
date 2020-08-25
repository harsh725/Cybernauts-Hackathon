$("#userImg").click(function() {
	window.location.href = "profile.html"; 
});

$("#Sign-out").click(function() {
	window.location.href = "index.html"; 
});
$("#Results").click(function() {
	window.location.href = "result.html"; 
});
$("#home").click(function() {
	window.location.href = "main.html"; 
});

function clickFun(subjectName) {
	$("#" + subjectName).addClass("hide");
	window.location.href = "exam.html?"+subjectName;
}