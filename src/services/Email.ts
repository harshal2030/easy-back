import NodeMailer from 'nodemailer';

class Email {
  public static transporter = NodeMailer.createTransport({
    // @ts-ignore
    host: process.env.emailHost!,
    port: process.env.emailPort!,
    auth: {
      user: process.env.emailUser!,
      pass: process.env.emailPass!,
    },
  })
}

// eslint-disable-next-line import/prefer-default-export
export { Email };
