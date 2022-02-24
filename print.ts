import chalk from 'chalk';

export default function (text: string) {
    const currDate = (new Date().toLocaleTimeString()).split(' ')[0];
    const dateForm = chalk.gray(`[${currDate}]`);
    const textForm = text
        .split('\n')
        .join('\n' + ' '.repeat(currDate.length + 3));

    console.log(`${dateForm} ${textForm}`);
}