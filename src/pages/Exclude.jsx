import list from '../files/exclude.json';

export default function Exclude() {
    const data = list;
    return (JSON.stringify(data, null, 2));
}
