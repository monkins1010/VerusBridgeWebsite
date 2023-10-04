import list from '../files/exclude.json';

export default function Exclude() {
    const data = list.ETH;
    return (JSON.stringify(data, null, 2));
}
