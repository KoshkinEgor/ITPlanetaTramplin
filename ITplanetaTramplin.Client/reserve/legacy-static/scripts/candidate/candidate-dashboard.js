document.addEventListener("DOMContentLoaded", function () {
  var input = document.getElementById("candidate-cover-upload");
  var status = document.querySelector("[data-cover-upload-status]");
  var label = document.querySelector("[data-cover-upload-label]");

  if (!input || !status || !label) {
    return;
  }

  var defaultStatus = status.textContent.trim();

  input.addEventListener("change", function () {
    var hasFile = input.files && input.files.length > 0;

    status.textContent = hasFile
      ? "Выбран файл: " + input.files[0].name
      : defaultStatus;

    label.classList.toggle("is-selected", Boolean(hasFile));
  });
});
