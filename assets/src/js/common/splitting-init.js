import "splitting/dist/splitting.css";
import "splitting/dist/splitting-cells.css";
import Splitting from "splitting";

export default function initSplitting() {
	console.log('Splitting inited');
    
    Splitting({
        target: '.splitted_text_colors',
        by: 'chars'
    });

    const chars = document.querySelectorAll('.splitted_text_colors .char');
    chars.forEach((char) => {
        char.classList.add('my_colors');
    }); 
}