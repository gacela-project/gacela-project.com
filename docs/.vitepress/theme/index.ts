// https://vitepress.dev/guide/custom-theme
import { h } from 'vue'
import Theme from 'vitepress/theme-without-fonts'
import DocActions from './DocActions.vue'
import GacelaMark from './GacelaMark.vue'
import './style.css'

export default {
    extends: Theme,
    Layout: () => {
        return h(Theme.Layout, null, {
            // https://vitepress.dev/guide/extending-default-theme#layout-slots
            'home-hero-image': () => h(GacelaMark),
            'doc-before': () => h(DocActions),
        })
    },
}
