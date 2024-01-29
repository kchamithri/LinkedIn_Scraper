const axios = require("axios");
const cheerio = require("cheerio");
const ObjectsToCsv = require("objects-to-csv");

linkedinJobs = [];

for (let pageNumber = 0; pageNumber < 1000; pageNumber += 25) {
  let url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=&location=Sri%20Lanka&geoId=100446352&trk=public_jobs_jobs-search-bar_search-submit&currentJobId=2931031787&position=1&pageNum=0&start=${pageNumber}`;
  axios(url)
    .then(async (response) => {
      const html1 = response.data;
      const $ = cheerio.load(html1);
      const jobs = $("li");
      jobs.each((index, element) => {
        const jobTitle = $(element)
          .find("h3.base-search-card__title")
          .text()
          .trim();
        const company = $(element)
          .find("h4.base-search-card__subtitle")
          .text()
          .trim();
        const location = $(element)
          .find("span.job-search-card__location")
          .text()
          .trim();
        const link = $(element).find("a.base-card__full-link").attr("href");

        const newDate = new Date();
        const today =
          newDate.getFullYear() +
          "-" +
          (newDate.getMonth() + 1) +
          "-" +
          newDate.getDate();

        linkedinJobs.push({
          Title: jobTitle,
          Company: company,
          Location: location,
          Link: link,
          Description: "",
          Level: "",
          JobDescription: "",
          DatePosted: "",
          scrappedDate: today,
        });
      });

      for (let i = 0; i < linkedinJobs.length; i++) {
        const job = linkedinJobs[i];
        await axios(job.Link)
          .then(async (response) => {
            const html = response.data;
            const $ = cheerio.load(html);
            const jobCriteriaItems = $(
              'li[class="description__job-criteria-item"]'
            );
            let criteriaText = "";
            let level = "";
            for (let j = 0; j < jobCriteriaItems.length; j++) {
              const element = jobCriteriaItems[j];
              const h3 = $(element)
                .find('h3[class="description__job-criteria-subheader"]')
                .text()
                .trim();
              if (h3 === "Industries") {
                criteriaText = $(element)
                  .find(
                    'span[class="description__job-criteria-text description__job-criteria-text--criteria"]'
                  )
                  .text()
                  .trim();
              }
              if (h3 === "Seniority level") {
                level = $(element)
                  .find(
                    'span[class="description__job-criteria-text description__job-criteria-text--criteria"]'
                  )
                  .text()
                  .trim();
              }
              await new Promise((resolve) => setTimeout(resolve, 3000)); // wait for 3 second before the next iteration
            }
            job.Description = criteriaText;
            job.Level = level;
            const ksaDescriptionItems = $("div.show-more-less-html__markup");
            let ksaDescription = "";
            ksaDescriptionItems.each((index, element) => {
              const ul = $(element).find("ul");
              const liTags = ul.find("li");
              liTags.each((index, li) => {
                ksaDescription += $(li).text().trim() + "\n";
              });
            });
            job.JobDescription = ksaDescription;

            const datePostedElement = $(
              "span.posted-time-ago__text.topcard__flavor--metadata"
            );
            job.DatePosted = datePostedElement.text().trim();
          })
          .catch(console.error);
      }
      const csv = new ObjectsToCsv(linkedinJobs);
      csv.toDisk("./linkedInJobs.csv", { append: true });
    })
    .catch(console.error);
}
