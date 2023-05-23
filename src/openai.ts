import axios, { AxiosInstance } from 'axios';

export class OpenAI {
    private apiClient: AxiosInstance;
    private accessTokens: string[];
    private accessTokenIndex = 0;

    constructor(apiUrl: string, private accessToken: string) {
        this.accessTokens = accessToken.split(',');
        this.apiClient = axios.create({
            baseURL: apiUrl,
            // headers: {
            //     'Authorization': `Bearer ${accessToken}`,
            // },
        });
    }

    async reviewCodeChange(change: any) {
        // Implement your logic to call OpenAI API and get suggestions
        // For example:
        const newIndex = this.accessTokenIndex = (this.accessTokenIndex >= this.accessTokens.length - 1 ? 0 : this.accessTokenIndex + 1);
        const data ={
            "max_tokens": 1024,
            "n": 1,
            "stop": "\n\n",
            "temperature": 0.5,
            "model": "gpt-3.5-turbo",
            "stream": false,
            "messages": [
            {
                "role": "system",
                "content": "You are ChatGPT, a large language model trained by OpenAI. Answer as concisely as possible.\n Knowledge cutoff: 2021-09-01\n Current date: ${currentDate}"
            },
            {
                "role": "user",
                "content": `Bellow is the gitlab code patch, please help me do a brief code review,Answer me in chinese, if any bug risk and improvement suggestion are welcome. You don't need to explain to me what the code does, you just need to briefly tell me what bugs it has or what needs to be improved. If you think there is no problem with this code, you just need to reply with 666!!! \n
                    ${change}`,
                "name": "undefined"
            }
        ]
         };
        const response = await this.apiClient.post('/v1/chat/completions', {
            "max_tokens": 1024,
            "n": 1,
            "stop": "\n\n",
            "temperature": 0.5,
            "model": "gpt-3.5-turbo",
            "stream": false,
            "messages": [
                {
                    "role": "system",
                    "content": "You are ChatGPT, a large language model trained by OpenAI. Answer as concisely as possible.\n Knowledge cutoff: 2021-09-01\n Current date: ${currentDate}"
                },
                {
                    "role": "user",
                    "content": `Bellow is the gitlab code patch, please help me do a brief code review,Answer me in chinese, if any bug risk and improvement suggestion are welcome. You don't need to explain to me what the code does, you just need to briefly tell me what bugs it has or what needs to be improved. If you think there is no problem with this code, you just need to reply with 666!!! \n
                    ${change}`,
                    "name": "undefined"
                }
            ]
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.accessTokens[newIndex]}`
            }
        });
        console.log(JSON.stringify(data));
        console.log(response.data.choices, 'response');
        return response.data.choices[0].message?.content;
    }
}
