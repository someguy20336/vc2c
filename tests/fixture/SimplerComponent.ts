import Vue from 'vue'
import { Prop, Component } from 'vue-property-decorator'

/**
 * My basic tag
 */
@Component
export default class BasicPropertyClass extends Vue {
  /**
   * My foo
   */
  @Prop({ type: Number, default: false }) foo!: number

  /**
   * My greeting
   */
  hello () {
    console.log("eh")
  }
}
