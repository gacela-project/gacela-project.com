const copyButton = document.querySelector('#installation-composer .button-copy-code-snippet');
const codeText = document.querySelector('#installation-composer code');
const tooltip = document.querySelector('#installation-composer .tooltip-text');

copyButton.addEventListener('click', _ => {
    const selection = window.getSelection();

    const currentRange = selection.rangeCount === 0
        ? null : selection.getRangeAt(0);

    const range = document.createRange();
    range.selectNodeContents(codeText);
    selection.removeAllRanges();
    selection.addRange(range);

    try {
        document.execCommand('copy');
    } finally {
        selection.removeAllRanges();
        currentRange && selection.addRange(currentRange);
    }

    tooltip.style.visibility = 'visible';
    setTimeout(_ => {
        tooltip.style.visibility = 'hidden'
    }, 2000);
});