"use client";

import { useState } from "react";

import Modal from "../../components/modal";
import { Card } from "../../components/card";

//ADD REAL DATA TO MAP THE CARD COMPONENT

export default function JobResult() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open Modal</button>
      <Modal onClose={() => setIsOpen(false)} open={isOpen}>
        <p>
          I'm a modal window, I don't use portals but use the dialog element
          from the platform.
        </p>
        <p>
          Also tabbing is locked inside me go ahead and try tabbing to the
          button behind me.
        </p>
        <button onClick={() => setIsOpen(false)}>Close</button>
      </Modal>

      <div className="grid min-w-full grid-flow-row grid-cols-1 gap-3 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 3xl:grid-cols-44xl:grid-cols-3">
        <Card
          type="company"
          title="Job Title 3"
          postedBy="by Goodhive"
          postedOn="posted 2 days ago"
          image="/img/company_img.png"
          countryFlag="/img/country_flag.png"
          city=""
          rate=""
          currency=""
          description="Job description will come here when posted Amet, consecq consectetur consectetur adipiscing elit, sed do eiusmod tempor."
          skills={["Skill 1", "Skill 2", "Skill 3", "Skill 4"]}
          buttonText="Apply"
          escrowFee="500"
        />{" "}
        <Card
          type="company"
          title="Job Title 3"
          postedBy="by Goodhive"
          postedOn="posted 2 days ago"
          image="/img/company_img.png"
          countryFlag="/img/country_flag.png"
          city=""
          rate=""
          currency=""
          description="Job description will come here when posted Amet, consecq consectetur consectetur adipiscing elit, sed do eiusmod tempor."
          skills={["Skill 1", "Skill 2", "Skill 3", "Skill 4"]}
          buttonText="Apply"
          escrowFee="500"
        />{" "}
        <Card
          type="company"
          title="Job Title 3"
          postedBy="by Goodhive"
          postedOn="posted 2 days ago"
          image="/img/company_img.png"
          countryFlag="/img/country_flag.png"
          city=""
          rate=""
          currency=""
          description="Job description will come here when posted Amet, consecq consectetur consectetur adipiscing elit, sed do eiusmod tempor."
          skills={["Skill 1", "Skill 2", "Skill 3", "Skill 4"]}
          buttonText="Apply"
          escrowFee="500"
        />{" "}
        <Card
          type="company"
          title="Job Title 3"
          postedBy="by Goodhive"
          postedOn="posted 2 days ago"
          image="/img/company_img.png"
          countryFlag="/img/country_flag.png"
          city=""
          rate=""
          currency=""
          description="Job description will come here when posted Amet, consecq consectetur consectetur adipiscing elit, sed do eiusmod tempor."
          skills={["Skill 1", "Skill 2", "Skill 3", "Skill 4"]}
          buttonText="Apply"
          escrowFee="500"
        />
      </div>
    </>
  );
}
