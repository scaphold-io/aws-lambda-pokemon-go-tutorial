const config = {
    aws: {
        lambda: {
            name: "scaphold-lambda-ios-push",
            handler: "dist/index.handler"
        }
    },
    scapholdUrl: "https://api.scaphold.io/graphql/pokemon-go-clone"
}

export default config;