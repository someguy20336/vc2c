import Vue from 'vue'
import { Prop, Component } from 'vue-property-decorator'

export class NonComponent {
    public testOne: string = "1";
    public testTwo: number = 2;
}

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