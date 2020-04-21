import './css/Loading.css';

export default function Load(load = true) {
  // check if a loading div exists
  let loading = document.getElementById("loading");
  let loadingContent = document.getElementById("loadingContent");
  if (loading === null || loadingContent === null) {
    console.error('It looks like this page was incomplete, please add the following HTML:\n<div id="loading" class="noselect">\n\t<div id="loadingContent">\n\t\t<img src="/images/loading.svg" alt="Loading..." />\n\t</div>\n</div>');
    return;
  }
  // fadein
  if (load) {
    loading.style.display = 'block';
    loadingContent.setAttribute('class', 'fade-in');
    return
  }
  // fadeout
  setTimeout(function() {
    //fade out
    loadingContent.setAttribute('class', 'fade-out');
    //remove fadeout
    setTimeout(function() {
      loading.style.display = "none";
      loading.setAttribute('class', '');
    }, 200);
  }, 500);
}
