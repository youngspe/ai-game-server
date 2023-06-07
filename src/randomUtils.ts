export function randInt(max: number) {
    return (Math.random() * max) | 0
}

export function shuffle<T>(array: T[]) {
    for (let i = 0; i < array.length; ++i) {
        array[i] = array[i + randInt(array.length - i)]
    }
}
