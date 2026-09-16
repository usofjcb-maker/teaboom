export default function copyrightInit(){
    const currentYear = new Date().getFullYear();

    const cpr = document.querySelectorAll('.cpr');
    cpr.forEach(function(item){
        item.innerText = currentYear;
    });	
}