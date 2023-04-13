import Vue from 'vue'
import { Prop, Component } from 'vue-property-decorator'

/**
 * My basic tag
 */
@Component
export class BasicPropertyClass extends Vue {
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

@Component
export class AnotherComponent extends Vue {
  /**
   * My foo
   */
  @Prop({ type: Number, default: false }) foo!: number

  /**
   * My greeting
   */
  hello2 () {
    console.log("eh")
  }
}

@Component
export default class AThirdDefaultComponent extends Vue {
  /**
   * My foo
   */
  @Prop({ type: Number, default: false }) foo!: number

  /**
   * My greeting
   */
  hello3 () {
    console.log("eh")
  }
}