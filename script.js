const startbtn = document.querySelector(".startbtn");
const container = document.querySelector(".container");
const close = document.querySelector(".close");




startbtn.addEventListener("click", ()=>{
    container.computedStyleMap.display="flex"
})

close.addEventListener("click", ()=>{
    container.computedStyleMap.display="none"
})