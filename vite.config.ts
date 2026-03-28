import chordPackage from '@keychord/vite-plugin'

export default {
  plugins: [chordPackage({
    vendor: ['@keychord/chords-menu']
  })]
}