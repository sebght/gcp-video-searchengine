import { shallowMount } from '@vue/test-utils'
import HelloWorld from '@/components/HelloWorld.vue'

jest.mock('@/api/cloudfunction', () => ({
  getResult: jest.fn(() => 'Hello World!')
}))

describe('HelloWorld.vue', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  describe('#method callCloudFunction', () => {
    describe('before GCF call is over', () => {
      it('result div should not be visible', () => {
        // when
        const wrapper = shallowMount(HelloWorld)
        const result = wrapper.find('.result')
        // wrapper.find('button').trigger('click')
        wrapper.vm.callCloudFunction()

        // then
        expect(result.isVisible()).toBe(false)
      })

      it('should display loading spinner', () => {
        // when
        const wrapper = shallowMount(HelloWorld)
        const loading = wrapper.find('.loading')
        wrapper.find('button').trigger('click')

        // then
        expect(wrapper.vm.loading).toBe(true)
        expect(loading.isVisible()).toBe(true)
      })
    })

    describe('after GCF call is over', () => {
      it('should add result string into result', async () => {
        // when
        const wrapper = shallowMount(HelloWorld)
        wrapper.find('button').trigger('click')
        const result = wrapper.find('.result')
        await wrapper.vm.$nextTick()

        // then
        expect(result.text()).toContain('Hello World!')
        expect(wrapper.vm.result).toBe('Hello World!')
      })

      it('should put isLoading to false after all', async () => {
        // when
        const wrapper = shallowMount(HelloWorld)
        wrapper.find('button').trigger('click')
        const loading = wrapper.find('.loading')
        await wrapper.vm.$nextTick()

        // then
        expect(wrapper.vm.loading).toBe(false)
        expect(loading.isVisible()).toBe(false)
      })
    })
  })
})
