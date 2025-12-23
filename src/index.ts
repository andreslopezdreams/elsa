import { Elysia, t } from "elysia";
import { openapi, fromTypes } from '@elysiajs/openapi'
import { jwt, type JWTPayloadSpec, JWTOption } from '@elysiajs/jwt'

interface DB {
  version: string
}



abstract class AppContenxt {
  private static db: DB

  static setDB(db: DB) {
    this.db = db
  }

  static getDb(): DB {
    return this.db;
  }
} 


class BrcService {
  constructor(private readonly jwt: any){}

  findAll() {
    return 'data';
  }
}

abstract class TenantService {
  static exist(): string {
    return 'tenant';
  }
}


abstract class UserService {
  static getName(){
    const db = AppContenxt.getDb()
    return `${TenantService.exist()} ${db.version}`
  }
}
type CustomJwt = Awaited<typeof jwt>


export class PropertyService {
  private properties = new Map<number, { id: number; name: string }>()
  find(id: number) {
    return this.properties.get(id) ?? null
  }
  create(name: string) {
    const id = Date.now()
    const property = { id, name }
    this.properties.set(id, property)
    return property
  }
}


export const PropertyPlugin = new Elysia({
  name: "Property.Plugin",
}).decorate("propertyService", new PropertyService())


const plugin = new Elysia({ name: 'customplugin' })
    .macro({
        hi: (word: string) => ({
            afterHandle() {
                console.log(word)
            }
        })

    })

class Logger {
  constructor() {}
      log(value: string) {
          console.log(value)
      }
  }


class BrcController {
  constructor(
    private readonly db: DB,
    private readonly brcService: BrcService
  ){}

  findAll() {
    queueMicrotask(async () => {
      await new Promise((resolve) => setTimeout(resolve, 4000))
      console.log('datos desde el controller')
    })
    return this.brcService.findAll()
  }
}


const app = new Elysia()
  .use(openapi({ 
    documentation: {
        info: {
            title: 'Kivo Documentation',
            
            version: '1.0.0'
        }
    }
   }))
   .use(jwt({
      name: 'jwt',
      secret: 'Fischl von Luftschloss Narfidort'
  }))
  .use(plugin)
  
  .decorate('logger', new Logger())
  .decorate('nuevo', () => ({}))
  .derive(({ jwt }) => ({
    brcService: new BrcService(jwt)
  }))
  .derive(({ brcService }) => ({
    brcController: new BrcController({ version: '1' } , brcService)
  }))
  .use(PropertyPlugin)
  .get("/", () => "Hello Elysia")
  .post('/json', ({ body, brcController  }) => {
    
    return ({ id: '100', name: brcController.findAll() })
  }, {
    body: t.Object({
        hello: t.String({ description: 'mensaje de inicio', examples: "Hello from"})
    }, { description: 'Crear una propiedad'}),

    response: {
      200: t.Object({
        id: t.String(),
        name: t.String(),
      }),
      404: t.Object({
        error: t.String(),
      }),
    }

})
.onStart(context => {
  AppContenxt.setDB({ version: '1'})
})
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
