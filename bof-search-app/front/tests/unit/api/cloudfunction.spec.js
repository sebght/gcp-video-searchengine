import api from '@/api/cloudfunction'
import axios from 'axios'

jest.mock('axios')

describe('GCF API', () => {
  describe('#getResult', () => {
    beforeEach(() => {
      jest.resetModules()
      jest.clearAllMocks()
    })

    it('should fetch API with the good params', async () => {
      // given
      const resp = { data: 'GCF resp' }
      axios.get.mockResolvedValue(resp)

      // when
      await api.getResult()

      // then
      expect(axios.get).toHaveBeenCalledWith(`${process.env.VUE_APP_API_URL}`)
    })

    it('should return only the data', async () => {
      // given
      const resp = { data: 'Hello World!', headers: {} }
      axios.get.mockResolvedValue(resp)

      // when
      const result = await api.getResult()

      // then
      expect(result).toEqual('Hello World!')
    })
  })
})
